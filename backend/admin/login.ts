import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ApiError, SignedOutError } from './admin-api';
import { AdminState } from './state';

// The staff login. The password goes to POST api/login once; after that the session cookie does the work.
@Component({
  selector: 'ia-login',
  templateUrl: './login.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  protected readonly state = inject(AdminState);
  protected readonly user = signal('');
  protected readonly password = signal('');
  protected readonly busy = signal(false);
  protected readonly error = signal('');

  protected field(which: 'user' | 'password', event: Event): void {
    this[which].set((event.target as HTMLInputElement).value);
  }

  protected async submit(event: Event): Promise<void> {
    event.preventDefault();
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    try {
      const me = await this.state.api.login(this.user(), this.password());
      this.password.set('');
      this.state.signedIn(me);
    } catch (err) {
      if (err instanceof ApiError && err.status === 503) this.state.fail(err);
      else this.error.set(err instanceof SignedOutError || err instanceof ApiError ? err.message : 'The server did not answer. Try again.');
    } finally {
      this.busy.set(false);
    }
  }
}
