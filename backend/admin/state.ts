import { Injectable, signal } from '@angular/core';
import { AdminApi, ApiError, Me, SignedOutError, Stats, Versions } from './admin-api';

const REFRESH_MS = 5_000;

export type AuthState = 'checking' | 'signed-out' | 'signed-in' | 'off';

// What every admin section shares: who is signed in, and the stats and versions the shell refreshes every 5 s.
// Any call that comes back 401 lands here and sends the page back to the login form.
@Injectable({ providedIn: 'root' })
export class AdminState {
  readonly api = new AdminApi();
  readonly auth = signal<AuthState>('checking');
  readonly user = signal('');
  /** A line for the login form: why it is showing. */
  readonly notice = signal('');
  readonly stats = signal<Stats | null>(null);
  readonly versions = signal<Versions | null>(null);
  readonly error = signal('');
  readonly now = signal(Date.now());

  private timer: ReturnType<typeof setInterval> | undefined;

  async check(): Promise<void> {
    try {
      this.signedIn(await this.api.me());
    } catch (err) {
      this.fail(err);
    }
  }

  signedIn(me: Me): void {
    this.user.set(me.user);
    this.notice.set('');
    this.error.set('');
    this.auth.set('signed-in');
    void this.refresh();
    clearInterval(this.timer);
    this.timer = setInterval(() => void this.refresh(), REFRESH_MS);
  }

  async logout(): Promise<void> {
    try {
      await this.api.logout();
    } catch {
      // Signed out here either way; the cookie is cleared by the server or ends by itself.
    }
    this.signOut('You are signed out.');
  }

  async refresh(): Promise<void> {
    try {
      const [stats, versions] = await Promise.all([this.api.stats(), this.api.versions()]);
      this.stats.set(stats);
      this.versions.set(versions);
      this.now.set(Date.now());
      this.error.set('');
    } catch (err) {
      this.fail(err);
    }
  }

  /** Every section reports its failures here, so a lost session always ends at the login form. */
  fail(err: unknown): void {
    if (err instanceof SignedOutError) {
      this.signOut(this.auth() === 'signed-in' ? 'Your session ended. Sign in again.' : '');
    } else if (err instanceof ApiError && err.status === 503) {
      this.stop();
      this.notice.set(err.message);
      this.auth.set('off');
    } else if (err instanceof ApiError && err.status === 429) {
      this.signOut(err.message);
    } else {
      this.error.set(err instanceof Error ? err.message : String(err));
    }
  }

  private signOut(notice: string): void {
    this.stop();
    this.stats.set(null);
    this.versions.set(null);
    this.user.set('');
    this.notice.set(notice);
    this.auth.set('signed-out');
  }

  private stop(): void {
    clearInterval(this.timer);
    this.timer = undefined;
  }
}
