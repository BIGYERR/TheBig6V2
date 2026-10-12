// The admin API, read with fetch. Paths are relative, so they resolve under <base href="/admin/">. The session is an
// HttpOnly cookie the server sets at login and the browser sends back on every same-origin request.

export interface Latency {
  samples: number;
  avg: number | null;
  p50: number | null;
  p95: number | null;
  min: number | null;
  max: number | null;
}

export interface ServerInfo {
  kind: string;
  name: string;
  version: string;
  commit: string;
  release: string;
  node: string;
  uptimeS: number;
  persistent: boolean;
  beatMs: number;
  connectedWindowMs: number;
  maxDevices: number;
  corsOrigins: string[];
  sessionMinutes: number;
  /** The app's version as bundled at /app/ (its ia-version), or '' when no app is bundled. */
  appVersion: string;
  appSemver: string;
}

export interface Stats {
  now: number;
  connectedWindowMs: number;
  connected: number;
  uniques: number;
  beatsTotal: number;
  latency: Latency;
  latestApp: string;
  outdated: number;
  server: ServerInfo;
}

export interface Device {
  uid: string;
  name: string;
  deviceName: string;
  label: string;
  platform: string;
  appVersion: string;
  appSemver: string;
  outdated: boolean;
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
  latest: string;
}

export interface DeviceQuery {
  q: string;
  name: string;
  connected: boolean;
  outdated: boolean;
  page: number;
  pageSize: number;
}

export interface VersionRow {
  version: string;
  semver: string;
  devices: number;
  connected: number;
  lastSeen: number;
  outdated: boolean;
}

export interface Versions {
  latest: string;
  latestSemver: string;
  /** 'config' (APP_LATEST_VERSION), 'app' (the app served at /app/) or 'devices' (the newest any device reported). */
  latestFrom: string;
  outdated: number;
  rows: VersionRow[];
}

export interface Me {
  user: string;
  via: string;
  expiresAt: number;
}

/** The server answered 401: no session, or it ended. */
export class SignedOutError extends Error {}

/** Any other answer that is not OK, with the server's own message. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export class AdminApi {
  me(): Promise<Me> {
    return this.send('api/me');
  }

  login(user: string, password: string): Promise<Me> {
    return this.send('api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user, password }) });
  }

  async logout(): Promise<void> {
    await this.send('api/logout', { method: 'POST' });
  }

  stats(): Promise<Stats> {
    return this.send('api/stats');
  }

  versions(): Promise<Versions> {
    return this.send('api/versions');
  }

  devices(query: DeviceQuery): Promise<DevicePage> {
    const params = new URLSearchParams({
      q: query.q,
      name: query.name,
      page: String(query.page),
      pageSize: String(query.pageSize),
    });
    if (query.connected) params.set('connected', '1');
    if (query.outdated) params.set('outdated', '1');
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
    const body = (await res.json().catch(() => null)) as (T & { error?: string }) | null;
    if (res.status === 401) throw new SignedOutError(body?.error ?? 'Sign in required.');
    if (!res.ok) throw new ApiError(res.status, body?.error ?? `The server answered ${res.status}.`);
    return body as T;
  }
}
