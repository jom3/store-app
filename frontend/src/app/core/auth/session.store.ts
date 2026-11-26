import { computed, Injectable, signal } from '@angular/core';
import { AuthUser } from './auth.models';

@Injectable({ providedIn: 'root' })
export class SessionStore {
  private readonly currentUser = signal<AuthUser | null>(null);

  readonly user = this.currentUser.asReadonly();
  readonly mustChangePassword = signal(false);
  readonly isAuthenticated = computed(() => this.currentUser() !== null);

  set(user: AuthUser, mustChangePassword: boolean): void {
    this.currentUser.set(user);
    this.mustChangePassword.set(mustChangePassword);
  }

  clear(): void {
    this.currentUser.set(null);
    this.mustChangePassword.set(false);
  }
}
