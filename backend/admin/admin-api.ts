// The admin API, read with fetch. Paths are relative, so they resolve under <base href="/admin/">.
// The browser resends the Basic auth login it prompted for on every same-origin request.

export interface Latency {
  samples: number;
  avg: number | null;
  p50: number | null;
  p95: number | null;
  min: number | null;
  max: number | null;
}

export interface Stats {
  now: number;
  connectedWindowMs: number;
  connected: number;
  uniques: number;
  beatsTotal: number;
  latency: Latency;
  server: { version: string; commit: string; release: string; uptimeS: number; persistent: boolean };
}

export interface Device {
  uid: string;
  name: string;
  deviceName: string;
  label: string;
  platform: string;
  appVersion: string;
  screen: string;
  ua: string;
  firstSeen: number;
  lastSeen: number;
  connected: boolean;
  connectedSince: number;
  sessions: number;
  beats: number;
  latency: Latency & { last: number | null };
}

export interface DevicePage {
  items: Device[];
  total: number;
  page: number;
  pageSize: number;
  pages: number;
}

export interface DeviceQuery {
  q: string;
  name: string;
  connected: boolean;
  page: number;
  pageSize: number;
}

export class AdminApi {
  stats(): Promise<Stats> {
    return this.send('api/stats');
  }

  devices(query: DeviceQuery): Promise<DevicePage> {
    const params = new URLSearchParams({
      q: query.q,
      name: query.name,
      page: String(query.page),
      pageSize: String(query.pageSize),
    });
    if (query.connected) params.set('connected', '1');
    return this.send(`api/devices?${params}`);
  }

  rename(uid: string, name: string): Promise<Device> {
    return this.send(`api/devices/${encodeURIComponent(uid)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
  }

  private async send<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await fetch(path, { ...init, cache: 'no-store', credentials: 'same-origin' });
    if (res.status === 401) throw new Error('Signed out. Reload the page to sign in again.');
    if (!res.ok) throw new Error(`The server answered ${res.status}.`);
    return (await res.json()) as T;
  }
}
